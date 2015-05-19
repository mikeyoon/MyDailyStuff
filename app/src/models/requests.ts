/**
 * Created by myoon on 4/30/2015.
 */

export class EditJournalEntry {
    entry: string;
    index: number;

    constructor(entry: string, index: number) {
        this.entry = entry;
        this.index = index;
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

export class Register {
    email: string;
    password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}

export class PasswordReset {
    token: string;
    password: string;

    constructor(token: string, password: string) {
        this.token = token;
        this.password = password;
    }
}