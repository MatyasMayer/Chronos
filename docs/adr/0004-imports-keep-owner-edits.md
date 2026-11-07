# Imported items keep the owner's edits and survive their source

Chronos imports Events and Tasks from sources it does not control, and those sources give little to work with: Sirius omits a cancelled class instead of flagging it, its feed reaches only about a year back, and Moodle exports only a time window and never says whether work was submitted. So an Import owns only the fields the owner has not touched, and a missing item is not proof that it was removed. We chose per-field ownership over read-only items, overwriting on every sync, or detaching an item on its first edit, because it is the only option that protects the owner's edits and still picks up a moved class.

## Rules

- **Edits:** an edited field stops following its Import; all other fields keep updating. Anything the owner adds is never touched, and an item the owner deletes stays deleted.
- **Past items:** never changed because they went missing.
- **Failed or suspiciously empty sources:** change nothing.
- **Missing future items:** an untouched item is soft-deleted and restored if it returns. An item the owner edited or attached something to is kept and marked Cancelled. Neither sends reminders.
- **Disconnecting an Import, or a source that stops:** every item stays and becomes an ordinary item.

## Consequences

- Each imported item stores its source, its external ID and which fields the owner has edited.
- A field the owner edited does not follow later university changes.
- An untouched cancelled class disappears from the schedule with no visible notice. We accepted this because marking every missing item Cancelled would leave a term of struck-through classes after a parallel swap.
- An imported Task stays open until the owner ticks it, and shows as overdue after its date, because Moodle cannot report a submission.
