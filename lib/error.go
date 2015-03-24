package lib

import (
    "errors"
)

var UserNotFound = errors.New("User not found")
var UserAlreadyExists = errors.New("User already exists")
var EmailInUse = errors.New("Email already in use")
var NoJournalWithDate = errors.New("No entry with that date")
var EntryNotFound = errors.New("Journal entry not found")
var EntryAlreadyExists = errors.New("Journal entry already exists")