CREATE TABLE IF NOT EXISTS pedagogical_records (
    id VARCHAR(50) PRIMARY KEY,
    teacherName VARCHAR(255) NOT NULL,
    weekStart VARCHAR(20) NOT NULL,
    checklist TEXT,
    classHours TEXT,
    observation TEXT,
    missed_classes TEXT
);
