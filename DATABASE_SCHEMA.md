# Database Schema Reference

## Core Tables
- `users`: User authentication, roles, locked status, failed login counts.
- `business_years`: Fiscal year management (`year_name`, `start_date`, `end_date`, `is_active`).
- `products`: Product Master catalog (`brand_name`, `tp`, `dp`, `per_unit_price`, `group_id`).
- `doctors`: Prescribing practitioner registry (`name`, `specialty`, `qualification`, `area_id`).
- `institutions`: Medical facilities (`name`, `type`, `address`, `area_id`).
- `areas`: Sales territories (`name`, `region`).
- `team_members`: Sales reps and field staff (`name`, `role`, `area_id`).
- `product_targets`: Target allocations per product and business year.
- `orders`: Sales transactions (`order_number`, `order_date`, `status`, `total_amount`).
- `order_items`: Line items (`order_id`, `product_id`, `quantity`, `unit_price`, `discount_percent`).
- `audit_logs`: Enterprise audit log (`module`, `entity_type`, `action`, `performed_by`).
