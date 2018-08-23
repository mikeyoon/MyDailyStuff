/**
 * Created by myoon on 4/30/2015.
 */

export class EditJournalEntry {
  entry: string | null;
  index: number;

  constructor(entry: string | null, index: number) {
    this.entry = entry;
    this.index = index;
  }
}

export class Login {
  email: string;
  password: string;
  persist: boolean;

  constructor(email: string, password: string, persist: boolean) {
    this.email = email;
    this.password = password;
    this.persist = persist;
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

export class SaveProfile {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}

export class PasswordReset {
  token: string;
  password: string;

  constructor(token: string, password: string) {
    this.token = token;
    this.password = password;
  }
}

export class Search {
  offset: number;

  constructor(offset: number) {
    this.offset = offset;
  }
}
