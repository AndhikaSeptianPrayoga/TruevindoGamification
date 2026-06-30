create extension if not exists pgcrypto;

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  password_hash text not null,
  full_name varchar(120) not null,
  created_at timestamptz not null default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title varchar(160) not null,
  description text not null default '',
  status varchar(20) not null default 'draft',
  created_by uuid not null references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  order_no int not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  duration_seconds int not null default 20,
  created_at timestamptz not null default now(),
  unique (quiz_id, order_no)
);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  pin_code varchar(8) not null unique,
  status varchar(30) not null default 'waiting',
  current_question_index int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  display_name varchar(80) not null,
  score int not null default 0,
  current_rank int not null default 0,
  connected boolean not null default true,
  joined_at timestamptz not null default now()
);

create table answer_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_option char(1) not null check (selected_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  response_time_ms int not null,
  score_awarded int not null default 0,
  submitted_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create table leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  rank_no int not null,
  participant_id uuid not null references participants(id) on delete cascade,
  score int not null,
  created_at timestamptz not null default now()
);

create index idx_questions_quiz_id on questions(quiz_id);
create index idx_game_sessions_quiz_id on game_sessions(quiz_id);
create index idx_participants_session_id on participants(session_id);
create index idx_answers_session_question on answer_submissions(session_id, question_id);
create index idx_leaderboard_session on leaderboard_snapshots(session_id, created_at desc);
