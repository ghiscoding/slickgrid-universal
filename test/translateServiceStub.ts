import { TranslaterService } from '../packages/common/src/services/translater.service';

export class TranslateServiceStub implements TranslaterService {
  _locale = 'en';
  getCurrentLocale(): string {
    return this._locale;
  }
  translate(translationKey: string): string {
    let output = translationKey;
    switch (translationKey) {
      case 'ALL_SELECTED': output = this._locale === 'en' ? 'All Selected' : 'Tout sélectionnés'; break;
      case 'CANCEL': output = this._locale === 'en' ? 'Cancel' : 'Annuler'; break;
      case 'CLEAR_ALL_GROUPING': output = this._locale === 'en' ? 'Clear all Grouping' : 'Supprimer tous les groupes'; break;
      case 'CLEAR_ALL_FILTERS': output = this._locale === 'en' ? 'Clear all Filters' : 'Supprimer tous les filtres'; break;
      case 'CLEAR_ALL_SORTING': output = this._locale === 'en' ? 'Clear all Sorting' : 'Supprimer tous les tris'; break;
      case 'CLEAR_FROZEN_COLUMNS': output = this._locale === 'en' ? 'Clear Frozen Columns' : 'Libérer les colonnes gelées'; break;
      case 'COLUMNS': output = this._locale === 'en' ? 'Columns' : 'Colonnes'; break;
      case 'COMMANDS': output = this._locale === 'en' ? 'Commands' : 'Commandes'; break;
      case 'COLLAPSE_ALL_GROUPS': output = this._locale === 'en' ? 'Collapse all Groups' : 'Réduire tous les groupes'; break;
      case 'CONTAINS': output = this._locale === 'en' ? 'Contains' : 'Contient'; break;
      case 'COPY': output = this._locale === 'en' ? 'Copy' : 'Copier'; break;
      case 'ENDS_WITH': output = this._locale === 'en' ? 'Ends With' : 'Se termine par'; break;
      case 'EQUALS': output = this._locale === 'en' ? 'Equals' : 'Égale'; break;
      case 'EXPAND_ALL_GROUPS': output = this._locale === 'en' ? 'Expand all Groups' : 'Étendre tous les groupes'; break;
      case 'EXPORT_TO_CSV': output = this._locale === 'en' ? 'Export in CSV format' : 'Exporter en format CSV'; break;
      case 'EXPORT_TO_EXCEL': output = this._locale === 'en' ? 'Export to Excel' : 'Exporter vers Excel'; break;
      case 'EXPORT_TO_TAB_DELIMITED': output = this._locale === 'en' ? 'Export in Text format (Tab delimited)' : 'Exporter en format texte (délimité par tabulation)'; break;
      case 'EXPORT_TO_TEXT_FORMAT': output = this._locale === 'en' ? 'Export in Text format' : 'Exporter en format texte'; break;
      case 'FEMALE': output = this._locale === 'en' ? 'Female' : 'Femme'; break;
      case 'FIRST_NAME': output = this._locale === 'en' ? 'First Name' : 'Prénom'; break;
      case 'FORCE_FIT_COLUMNS': output = this._locale === 'en' ? 'Force fit columns' : 'Ajustement forcé des colonnes'; break;
      case 'FREEZE_COLUMNS': output = this._locale === 'en' ? 'Freeze Columns' : 'Geler les colonnes'; break;
      case 'GROUP_BY': output = this._locale === 'en' ? 'Grouped By' : 'Groupé par'; break;
      case 'HELLO': output = this._locale === 'en' ? 'Hello' : 'Bonjour'; break;
      case 'HELP': output = this._locale === 'en' ? 'Help' : 'Aide'; break;
      case 'HIDE_COLUMN': output = this._locale === 'en' ? 'Hide Column' : 'Cacher la colonne'; break;
      case 'LAST_NAME': output = this._locale === 'en' ? 'Last Name' : 'Nom de famille'; break;
      case 'LAST_UPDATE': output = this._locale === 'en' ? 'Last Update' : 'Dernière mise à jour'; break;
      case 'MALE': output = this._locale === 'en' ? 'Male' : 'Mâle'; break;
      case 'ITEMS': output = this._locale === 'en' ? 'items' : 'éléments'; break;
      case 'ITEMS_PER_PAGE': output = this._locale === 'en' ? 'items per page' : 'éléments par page'; break;
      case 'OF': output = this._locale === 'en' ? 'of' : 'de'; break;
      case 'OK': output = this._locale === 'en' ? 'OK' : 'Terminé'; break;
      case 'OPTIONS_LIST': output = this._locale === 'en' ? 'Options List' : 'Liste d\'options'; break;
      case 'OTHER': output = this._locale === 'en' ? 'Other' : 'Autre'; break;
      case 'PAGE': output = this._locale === 'en' ? 'Page' : 'Page'; break;
      case 'REFRESH_DATASET': output = this._locale === 'en' ? 'Refresh Dataset' : 'Rafraîchir les données'; break;
      case 'REMOVE_FILTER': output = this._locale === 'en' ? 'Remove Filter' : 'Supprimer le filtre'; break;
      case 'REMOVE_SORT': output = this._locale === 'en' ? 'Remove Sort' : 'Supprimer le tri'; break;
      case 'SORT_ASCENDING': output = this._locale === 'en' ? 'Sort Ascending' : 'Trier par ordre croissant'; break;
      case 'SORT_DESCENDING': output = this._locale === 'en' ? 'Sort Descending' : 'Trier par ordre décroissant'; break;
      case 'SAVE': output = this._locale === 'en' ? 'Save' : 'Sauvegarder'; break;
      case 'STARTS_WITH': output = this._locale === 'en' ? 'Starts With' : 'Commence par'; break;
      case 'SYNCHRONOUS_RESIZE': output = this._locale === 'en' ? 'Synchronous resize' : 'Redimension synchrone'; break;
      case 'TITLE': output = this._locale === 'en' ? 'Title' : 'Titre'; break;
      case 'TOGGLE_FILTER_ROW': output = this._locale === 'en' ? 'Toggle Filter Row' : 'Basculer la ligne des filtres'; break;
      case 'TOGGLE_PRE_HEADER_ROW': output = this._locale === 'en' ? 'Toggle Pre-Header Row' : 'Basculer la ligne de pré-en-tête'; break;
      case 'TRUE': output = this._locale === 'en' ? 'True' : 'Vrai'; break;
      case 'USER_PROFILE': output = this._locale === 'en' ? 'User Profile' : `Profile d'usager`; break;
      case 'COMPANY_PROFILE': output = this._locale === 'en' ? 'Company Profile' : `Profile de compagnie`; break;
      case 'SALES': output = this._locale === 'en' ? 'Sales' : 'Ventes'; break;
      case 'SALES_REP': output = this._locale === 'en' ? 'Sales Rep.' : 'Représentant des ventes'; break;
      case 'SELECT_ALL': output = this._locale === 'en' ? 'Select All' : 'Sélectionner tout'; break;
      case 'FINANCE_MANAGER': output = this._locale === 'en' ? 'Finance Manager' : 'Responsable des finances'; break;
      case 'HUMAN_RESOURCES': output = this._locale === 'en' ? 'Human Resources' : 'Ressources humaines'; break;
      case 'IT_ADMIN': output = this._locale === 'en' ? 'IT Admin' : 'Administrateur IT'; break;
      case 'DEVELOPER': output = this._locale === 'en' ? 'Developer' : 'Développeur'; break;
      case 'X_OF_Y_SELECTED': output = this._locale === 'en' ? '# of % selected' : '# de % sélectionnés'; break;
    }
    return output;
  }
  setLocale(locale: string) {
    return new Promise(resolve => resolve(this._locale = locale));
  }
}
