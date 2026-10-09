package com.hostel360.settings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingsRepository extends JpaRepository<Settings, Long> {

    default Settings load() {
        return findById(1L).orElseThrow();
    }
}
