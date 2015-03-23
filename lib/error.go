package lib

import (
    "errors"
)

var UserNotFound = errors.New("User not found")
var UserAlreadyExists = errors.New("User already exists")
var EmailInUse = errors.New("Email already in use")