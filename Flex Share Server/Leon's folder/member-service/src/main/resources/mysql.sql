CREATE TABLE users (
   id BIGINT PRIMARY KEY AUTO_INCREMENT,
   email VARCHAR(32) NOT NULL DEFAULT '',
   name VARCHAR(32) NOT NULL DEFAULT '',
   password VARCHAR(32) NOT NULL DEFAULT '',
   role ENUM('passenger','driver','admin') NOT NULL DEFAULT 'passenger'
);

CREATE TABLE schedules (
     id BIGINT PRIMARY KEY AUTO_INCREMENT,
     time_create DATE NOT NULL,
     time_finish DATE NOT NULL,
     id_driver INT NOT NULL
);

CREATE TABLE schedule_passenger (
    id_schedule BIGINT NOT NULL,
    time_join DATE NOT NULL,
    time_finish DATE NOT NULL,
    id_passenger INT NOT NULL,
    PRIMARY KEY (id_schedule, id_passenger)
);