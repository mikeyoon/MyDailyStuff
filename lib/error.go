package lib

import (
	"errors"
)

var UserUnauthorized = errors.New("User not logged in")
var UserNotFound = errors.New("User not found")
var UserAlreadyExists = errors.New("User already exists")
var EmailInUse = errors.New("Email already in use")
var NoJournalWithDate = errors.New("No entry with that date")
var EntryNotFound = errors.New("Journal entry not found")
var EntryAlreadyExists = errors.New("Journal entry already exists")
var VerificationNotFound = errors.New("Verification token not found")
var ResetNotFound = errors.New("Password reset token not found")
var JournalEntryInvalid = errors.New("Journal entries must be 500 characters or less")
var JournalEntryEmpty = errors.New("Journal entry can't be empty")
var TooManyEntries = errors.New("Only a maximum of seven entries per day")

var PasswordInvalid = errors.New("Password must be 6 characters or more")
var EmailInvalid = errors.New("Email is invalid")
