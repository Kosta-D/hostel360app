package com.hostel360.common;

/** A request that is well-formed but breaks a business rule (double booking, over capacity...). */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
