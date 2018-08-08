import { observable, when } from 'mobx';
import actions from '../actions'
import * as Requests from "../models/requests";
import moment from 'moment';

declare var _gaq: any;

function trackEvent(category: string, action: string, label?: string, value?: Number, nonInteraction?: boolean) {
    _gaq.push(['_trackEvent', category, action, label, value, nonInteraction]);
}

var AnalyticsStore = Fluxxor.createStore({
    initialize: function() {
        this.enabled = typeof _gaq !== 'undefined';
        console.log('GA Enabled: ' + this.enabled);

        if (this.enabled) {
            this.bindActions(
                actions.constants.ACCOUNT.LOGIN, this.onLogin,
                actions.constants.ACCOUNT.PROFILE, this.onProfile,
                actions.constants.ACCOUNT.REGISTER, this.onRegister,
                actions.constants.ACCOUNT.LOGOUT, this.onLogout,
                actions.constants.ACCOUNT.VERIFY, this.onVerify,
                actions.constants.ACCOUNT.RESET_PASSWORD, this.onReset,
                actions.constants.ACCOUNT.SEND_RESET, this.onSendReset,
                actions.constants.ACCOUNT.SAVE_PROFILE, this.onSaveProfile,
                actions.constants.ACCOUNT.CLEAR_STORE, this.onClearStore,

                actions.constants.JOURNAL.GET, this.onJournalGet,
                actions.constants.JOURNAL.ADD, this.onJournalAdd,
                actions.constants.JOURNAL.EDIT, this.onJournalEdit,
                actions.constants.JOURNAL.DELETE, this.onJournalDelete,

                actions.constants.SEARCH.DATE, this.onSearchDate,
                actions.constants.SEARCH.QUERY, this.onSearchQuery
            );
        }
    },

    onLogin: function(payload: Requests.Login) {
        trackEvent('account', 'login');
    },
    onProfile: function() {
        trackEvent('account', 'profile');
    },
    onLogout: function() {
        trackEvent('account', 'logout');
    },
    onRegister: function(payload: Requests.Register) {
        trackEvent('account', 'register');
    },
    onVerify: function(token: string) {
        trackEvent('account', 'verify');
    },
    onSendReset: function(email: string) {
        trackEvent('account', 'send_reset');
    },
    onReset: function(payload: Requests.PasswordReset) {
        trackEvent('account', 'reset_password');
    },
    onSaveProfile: function(payload: Requests.SaveProfile) {
        trackEvent('account', 'update_profile');
    },
    onClearStore: function() {
    },

    onJournalAdd: function(entry: string) {
        trackEvent('journal', 'add');
    },
    onJournalEdit: function(entry: Requests.EditJournalEntry) {
        trackEvent('journal', 'edit');
    },
    onJournalGet: function(date: Date) {
        trackEvent('journal', 'get', moment(date).format("MM-DD-YYYY"));
    },
    onJournalDelete: function() {
        trackEvent('journal', 'delete');
    },

    onSearchDate: function(date: Date) {
        //_trackEvent('journal', 'delete');
    },
    onSearchQuery: function(query: string) {
        trackEvent('search', 'query', query);
    }
});

export default AnalyticsStore;