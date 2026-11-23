CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN (
    'candidate', 'employer', 'skilled_provider', 'supplier', 'buyer', 'event_member',
    'super_admin', 'talent_admin', 'verification_officer', 'events_admin',
    'supplier_admin', 'content_editor', 'finance_user', 'support_user'
  )),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inquiries (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(32) NULL,
  inquiry_type VARCHAR(40) NOT NULL CHECK (inquiry_type IN (
    'research_support', 'careers_talent', 'procurement_supply', 'events_networking', 'partnership', 'other'
  )),
  message VARCHAR(4000) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'closed')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY inquiries_status_created_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS opportunities (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  organization VARCHAR(180) NOT NULL,
  opportunity_type VARCHAR(24) NOT NULL CHECK (opportunity_type IN ('job', 'internship', 'attachment')),
  location VARCHAR(140) NOT NULL,
  duration VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  application_deadline DATE NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT opportunities_creator_fk FOREIGN KEY (created_by) REFERENCES users(id),
  KEY opportunities_status_created_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY,
  opportunity_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  cover_note TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'declined', 'withdrawn')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT applications_opportunity_fk FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  CONSTRAINT applications_candidate_fk FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY application_candidate_opportunity_unique (candidate_id, opportunity_id),
  KEY applications_candidate_created_idx (candidate_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS candidate_profiles (
  user_id CHAR(36) PRIMARY KEY,
  skills JSON NOT NULL,
  capability_summary VARCHAR(3000) NOT NULL DEFAULT '',
  opportunity_preference VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (opportunity_preference IN ('job', 'attachment', 'both')),
  resume_name VARCHAR(255) NULL,
  resume_mime VARCHAR(80) NULL,
  resume_data MEDIUMBLOB NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT candidate_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  venue VARCHAR(180) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  capacity INT UNSIGNED NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT events_creator_fk FOREIGN KEY (created_by) REFERENCES users(id),
  KEY events_status_starts_idx (status, starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_registrations (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT event_registrations_event_fk FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT event_registrations_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY event_registration_user_unique (event_id, user_id),
  KEY event_registrations_user_created_idx (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS supplier_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  business_name VARCHAR(180) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(140) NOT NULL,
  website VARCHAR(255) NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT supplier_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY supplier_profile_user_unique (user_id),
  KEY supplier_profiles_status_category_idx (verification_status, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS buyer_requests (
  id CHAR(36) PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  quantity VARCHAR(120) NOT NULL,
  delivery_location VARCHAR(180) NOT NULL,
  due_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT buyer_requests_user_fk FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY buyer_requests_status_created_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS supplier_responses (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'shortlisted', 'declined')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT supplier_responses_request_fk FOREIGN KEY (request_id) REFERENCES buyer_requests(id) ON DELETE CASCADE,
  CONSTRAINT supplier_responses_supplier_fk FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY supplier_response_unique (request_id, supplier_id),
  KEY supplier_responses_supplier_created_idx (supplier_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS marketplace_messages (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  message VARCHAR(4000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketplace_messages_request_fk FOREIGN KEY (request_id) REFERENCES buyer_requests(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_messages_supplier_fk FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY marketplace_messages_thread_idx (request_id,supplier_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS insights (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(180) NOT NULL,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(80) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  cover_image VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id CHAR(36) NOT NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT insights_author_fk FOREIGN KEY (author_id) REFERENCES users(id),
  UNIQUE KEY insights_slug_unique (slug),
  KEY insights_status_published_idx (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
