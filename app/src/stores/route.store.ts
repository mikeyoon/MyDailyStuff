import { observable, action } from "mobx";
import page from "page";
import * as Requests from "../models/requests";
import { AuthStore } from "./auth.store";
import { Moment } from "moment";

export enum Routes {
  About = "about",
  Journal = "journal",
  Login = "login",
  Home = "home",
  Register = "register",
  Profile = "profile",
  ForgotPassword = "forgot",
  ResetPassword = "reset",
  Search = "search"
}

export class RouteStore {
  @observable
  route: Routes;
  @observable
  params: { [name: string]: string };

  constructor(private authStore: AuthStore) {
    this.route = Routes.Search;
    this.params = {};

    page("/", () => this.setDefaultRoute());
    page("/login", () => this.setLoginRoute());
    page("/register", () => this.setRegisterRoute());
    page("/about", () => this.setAboutRoute());
    page("/journal", ctx => this.setJournalRoute(ctx));
    page("/journal/:date", ctx => this.setJournalRoute(ctx));
    page("/search/:query", ctx => this.setSearchRoute(ctx));
    page("/forgot-password", () => this.setForgotRoute());
    page("/account/verify/:token", ctx => this.setVerifyRoute(ctx));
    page("/account/reset/:token", ctx => this.setResetRoute(ctx));
    page.start();
  }

  @action
  setDefaultRoute() {
    if (this.authStore.isLoggedIn) {
      page.show("/journal");
    } else {
      page.show("/login");
    }
  }

  @action
  setLoginRoute() {
    if (this.authStore.isLoggedIn) {
      page.show("/journal");
    } else {
      this.route = Routes.Login;
      this.params = {};
    }
  }

  @action
  setRegisterRoute() {
    if (this.authStore.isLoggedIn) {
      page.show("/journal");
    } else {
      this.route = Routes.Register;
      this.params = {};
    }
  }

  @action
  setAboutRoute() {
    this.route = Routes.About;
    this.params = {};
  }

  @action
  setForgotRoute() {
    this.route = Routes.ForgotPassword;
    this.params = {};
  }

  @action
  setSearchRoute(ctx: PageJS.Context) {
    this.route = Routes.Search;
    this.params = ctx.params;
  }

  @action
  setJournalRoute(ctx: PageJS.Context) {
    this.route = Routes.Journal;
    this.params = ctx.params;
  }

  @action
  setVerifyRoute(ctx: PageJS.Context) {
    this.authStore.verify(ctx.params.token);
  }

  @action
  setResetRoute(ctx: PageJS.Context) {
    this.route = Routes.ResetPassword;
    this.params = ctx.params;
  }

  search(query: string, offset: number) {
    page("/search/" + query + "?offset=" + offset);
  }

  setDate(date: Moment) {
    page('/journal/' + date.format("YYYY-M-D"));
  }
}
