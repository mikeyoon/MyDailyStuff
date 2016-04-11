/**
 * Created by myoon on 4/30/2015.
 */
"use strict";
var EditJournalEntry = (function () {
    function EditJournalEntry(entry, index) {
        this.entry = entry;
        this.index = index;
    }
    return EditJournalEntry;
}());
exports.EditJournalEntry = EditJournalEntry;
var Login = (function () {
    function Login(email, password, persist) {
        this.email = email;
        this.password = password;
        this.persist = persist;
    }
    return Login;
}());
exports.Login = Login;
var Register = (function () {
    function Register(email, password) {
        this.email = email;
        this.password = password;
    }
    return Register;
}());
exports.Register = Register;
var SaveProfile = (function () {
    function SaveProfile(password) {
        this.password = password;
    }
    return SaveProfile;
}());
exports.SaveProfile = SaveProfile;
var PasswordReset = (function () {
    function PasswordReset(token, password) {
        this.token = token;
        this.password = password;
    }
    return PasswordReset;
}());
exports.PasswordReset = PasswordReset;
var Search = (function () {
    function Search(query, offset) {
        this.offset = offset;
        this.query = query;
    }
    return Search;
}());
exports.Search = Search;
