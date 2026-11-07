# Chronos

A personal study organiser that gathers everything about each subject a student takes into one place and ties its dates into a calendar.

## Language

**Subject**:
A single course the student is taking, and the hub that everything else about it hangs off.
_Avoid_: Course, class, předmět

**Semester**:
A named academic term (e.g. B241) during which Subjects are taken. A Subject may span several Semesters or belong to none (self-study).
_Avoid_: Term, period

**Tag**:
A user-defined label with a name and a stated meaning, attached to Subjects to group them across Semesters (e.g. "math", "FIT / KSI").
_Avoid_: Category, label, department, area

## Inside a Subject

**Project**:
A long-running piece of work within a Subject, spanning weeks, that holds its own Tasks, Notes and Resources (e.g. a semestral project or thesis).
_Avoid_: Assignment, semestral work

**Resource**:
Study material kept with a Subject: either a stored **file** (lecture slides, PDFs) or a **link** to a webpage, optionally with a saved snapshot of it.
_Avoid_: Material, attachment, document

**Task**:
A single piece of work you tick off when done, with an optional due date (e.g. a homework).
_Avoid_: To-do, assignment, deadline

**Event**:
Something scheduled over a time span that you attend, such as a lecture, lab, exam or presentation slot. May repeat, and need not belong to a Subject.
_Avoid_: Appointment, meeting, session

**Note**:
A free-form page you write yourself, which may belong to a Subject and link to any other item.
_Avoid_: Page, document

## Imports

**Import**:
A connection to an outside source, such as the Sirius timetable, that brings Events and Tasks into Chronos and keeps them up to date. What it brought in stays when the connection ends.
_Avoid_: Feed, subscription, sync

**Cancelled**:
The state of an imported Event or Task that left its Import but was kept because the owner had changed it.
_Avoid_: Deleted, removed

## Offline

**Pin**:
A per-device choice to keep a Subject, Project or Resource available offline on that device. It covers everything beneath it, and the nearest choice wins, so a single Resource can be excluded from a pinned Subject.
_Avoid_: Download, sync, cache, favourite

**Offline copy**:
The contents of a Resource stored on one device because a Pin covers it.
_Avoid_: Download, cached file, local file

**Conflict**:
A file Resource that holds two or more competing contents, because it was changed or deleted elsewhere after the change was started. It lasts until the owner chooses what to keep.
_Avoid_: Merge, clash, duplicate
