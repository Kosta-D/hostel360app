package com.hostel360.stay;

import com.hostel360.common.BusinessException;
import org.apache.poi.ss.usermodel.*;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Reads the reservations export from the Booking.com extranet (.xls or .xlsx).
 * Columns are found by header name, in Serbian or English, so column order doesn't matter.
 */
final class BookingExportReader {
    private BookingExportReader() {}

    /** One reservation line; {@code unitTypes} has one entry per booked room. */
    record Reservation(int line, String ref, String guestName, String countryCode, LocalDate checkIn, LocalDate checkOut,
                       String status, int people, BigDecimal price, String currency, List<String> unitTypes) {}

    private enum Col {
        REF("broj rezervacije", "book number", "reservation number"),
        GUEST("ime gosta", "guest name(s)", "guest name"),
        BOOKER("rezervisao/-la", "booked by"),
        CHECK_IN("prijavljivanje", "check-in"),
        CHECK_OUT("odjavljivanje", "check-out"),
        STATUS("status"),
        PEOPLE("osobe", "persons", "people"),
        PRICE("cena", "price"),
        COUNTRY("booker country"),
        UNIT_TYPE("vrsta jedinice", "unit type");

        final List<String> names;

        Col(String... names) {
            this.names = List.of(names);
        }
    }

    private static final DataFormatter FORMAT = new DataFormatter(Locale.ROOT);

    static List<Reservation> read(InputStream in) {
        try (var workbook = WorkbookFactory.create(in)) {
            var sheet = workbook.getSheetAt(0);
            var cols = columns(sheet.getRow(sheet.getFirstRowNum()));
            var result = new ArrayList<Reservation>();
            for (int i = sheet.getFirstRowNum() + 1; i <= sheet.getLastRowNum(); i++) {
                var row = sheet.getRow(i);
                if (row == null || text(row, cols, Col.REF).isEmpty()) continue;
                result.add(reservation(row, cols));
            }
            return result;
        } catch (IOException | RuntimeException e) {
            if (e instanceof BusinessException be) throw be;
            throw new BusinessException("This file couldn't be read. Upload the reservations export (.xls or .xlsx) from the Booking.com extranet.");
        }
    }

    private static Map<Col, Integer> columns(Row header) {
        var byName = new HashMap<String, Integer>();
        if (header != null) header.forEach(c -> byName.put(FORMAT.formatCellValue(c).trim().toLowerCase(Locale.ROOT), c.getColumnIndex()));
        var cols = new EnumMap<Col, Integer>(Col.class);
        for (var col : Col.values()) col.names.stream().filter(byName::containsKey).findFirst().ifPresent(n -> cols.put(col, byName.get(n)));
        var missing = EnumSet.complementOf(EnumSet.copyOf(cols.keySet()));
        missing.remove(Col.BOOKER);
        missing.remove(Col.COUNTRY);
        if (!missing.isEmpty())
            throw new BusinessException("This doesn't look like a Booking.com reservations export: missing column(s) "
                    + missing.stream().map(c -> "\"" + c.names.getFirst() + "\"").toList() + ".");
        return cols;
    }

    private static Reservation reservation(Row row, Map<Col, Integer> cols) {
        int line = row.getRowNum() + 1;
        var guest = text(row, cols, Col.GUEST);
        if (guest.isEmpty()) guest = text(row, cols, Col.BOOKER);
        if (guest.isEmpty()) guest = "Booking.com guest";
        var price = text(row, cols, Col.PRICE).split("\\s+");
        return new Reservation(line,
                text(row, cols, Col.REF),
                guest,
                text(row, cols, Col.COUNTRY),
                date(row, cols, Col.CHECK_IN, line),
                date(row, cols, Col.CHECK_OUT, line),
                text(row, cols, Col.STATUS).toLowerCase(Locale.ROOT),
                (int) Math.round(number(text(row, cols, Col.PEOPLE), line)),
                BigDecimal.valueOf(number(price[0], line)),
                price.length > 1 ? price[1].toUpperCase(Locale.ROOT) : "EUR",
                Arrays.stream(text(row, cols, Col.UNIT_TYPE).split(",\\s+")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    }

    private static String text(Row row, Map<Col, Integer> cols, Col col) {
        var index = cols.get(col);
        var cell = index == null ? null : row.getCell(index);
        return cell == null ? "" : FORMAT.formatCellValue(cell).trim();
    }

    private static LocalDate date(Row row, Map<Col, Integer> cols, Col col, int line) {
        var cell = row.getCell(cols.get(col));
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell))
            return cell.getLocalDateTimeCellValue().toLocalDate();
        var value = text(row, cols, col);
        try {
            return LocalDate.parse(value.substring(0, Math.min(10, value.length())));
        } catch (RuntimeException e) {
            throw new BusinessException("Line " + line + ": \"" + value + "\" is not a date.");
        }
    }

    private static double number(String value, int line) {
        try {
            return Double.parseDouble(value.replace(",", ""));
        } catch (NumberFormatException e) {
            throw new BusinessException("Line " + line + ": \"" + value + "\" is not a number.");
        }
    }
}
