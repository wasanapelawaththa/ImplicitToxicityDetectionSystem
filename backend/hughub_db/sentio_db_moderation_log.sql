USE hughub_db;

CREATE TABLE moderation_log (
  id              VARCHAR(15)   NOT NULL,
  content_type    ENUM('post','comment') NOT NULL,
  user_id         VARCHAR(15)   NOT NULL,
  content         TEXT          NOT NULL,
  predicted_label VARCHAR(50)   NOT NULL,
  predicted_score FLOAT         NOT NULL,
  created_time    DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_content_type (content_type),
  KEY idx_created_time (created_time)
  -- If you want FK, uncomment the line below and make sure `user.user_id` matches:
  -- ,CONSTRAINT fk_moderation_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;