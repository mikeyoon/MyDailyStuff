/**
 * Created by myoon on 4/30/2015.
 */

export class JournalEntry {
    entries: string[];
    date: Date;
    constructor(entries: string[], date: Date) {
        this.entries = entries;
        this.date = date;
    }
}

export class Login {
    email: string;
    password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}