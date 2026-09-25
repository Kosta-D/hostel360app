package com.hostel360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class Hostel360Application {
    public static void main(String[] args) {
        SpringApplication.run(Hostel360Application.class, args);
    }
}
