-- Rename participation columns to match activity types
-- Old names (very_high, high, normal, low, very_low) -> New names (attend, consult, involve, collaborate, empower)

ALTER TABLE item_details
    RENAME COLUMN very_high_participation_fvh TO attend_fa;

ALTER TABLE item_details
    RENAME COLUMN high_participation_fh TO consult_fc;

ALTER TABLE item_details
    RENAME COLUMN normal_participation_fn TO involve_fi;

ALTER TABLE item_details
    RENAME COLUMN low_participation_fl TO collaborate_fcol;

ALTER TABLE item_details
    RENAME COLUMN very_low_participation_fvl TO empower_femp;
