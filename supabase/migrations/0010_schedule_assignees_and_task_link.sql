-- Add assignee_ids to schedule_items (multiple members can be assigned)
alter table schedule_items add column assignee_ids uuid[] default '{}';

-- Add start_date for date range (due_date becomes end_date)
alter table schedule_items add column start_date date;

-- Add schedule_item_id to tasks to link tasks created from schedule items
alter table tasks add column schedule_item_id uuid references schedule_items(id) on delete set null;
