import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import type { TranslaterService, TranslateServiceEventName } from '@slickgrid-universal/common';

export class TranslateServiceStub implements TranslaterService {
  eventName = 'onLanguageChange' as TranslateServiceEventName;
  private _locale = 'en';

  addPubSubMessaging(_pubSubService: BasePubSubService) {}

  getCurrentLanguage(): string {
    return this._locale;
  }

  translate(translationKey: string): string {
    let output = translationKey;
    switch (translationKey) {
      case 'ALL_SELECTED':
        output = this._locale === 'en' ? 'All Selected' : 'Tout sélectionnés';
        break;
      case 'ALL_X_RECORDS_SELECTED':
        output = this._locale === 'en' ? 'All {{x}} records selected' : 'Sur tous les {{x}} éléments sélectionnés';
        break;
      case 'APPLY_MASS_UPDATE':
        output = this._locale === 'en' ? 'Apply Mass Update' : 'Mettre à jour en masse';
        break;
      case 'APPLY_TO_SELECTION':
        output = this._locale === 'en' ? 'Update Selection' : 'Mettre à jour la sélection';
        break;
      case 'CANCEL':
        output = this._locale === 'en' ? 'Cancel' : 'Annuler';
        break;
      case 'CLEAR_ALL_GROUPING':
        output = this._locale === 'en' ? 'Clear all Grouping' : 'Supprimer tous les groupes';
        break;
      case 'CLEAR_ALL_FILTERS':
        output = this._locale === 'en' ? 'Clear all Filters' : 'Supprimer tous les filtres';
        break;
      case 'CLEAR_ALL_SORTING':
        output = this._locale === 'en' ? 'Clear all Sorting' : 'Supprimer tous les tris';
        break;
      case 'CLEAR_PINNING':
        output = this._locale === 'en' ? 'Unfreeze Columns/Rows' : 'Dégeler les colonnes/rangées';
        break;
      case 'CLONE':
        output = this._locale === 'en' ? 'Clone' : 'Cloner';
        break;
      case 'COLUMNS':
        output = this._locale === 'en' ? 'Columns' : 'Colonnes';
        break;
      case 'COLUMN_RESIZE_BY_CONTENT':
        output = this._locale === 'en' ? 'Resize by Content' : 'Redimensionner par contenu';
        break;
      case 'COMMANDS':
        output = this._locale === 'en' ? 'Commands' : 'Commandes';
        break;
      case 'COLLAPSE_ALL_GROUPS':
        output = this._locale === 'en' ? 'Collapse all Groups' : 'Réduire tous les groupes';
        break;
      case 'CONTAINS':
        output = this._locale === 'en' ? 'Contains' : 'Contient';
        break;
      case 'COPY':
        output = this._locale === 'en' ? 'Copy' : 'Copier';
        break;
      case 'DELETE':
        output = this._locale === 'en' ? 'Delete' : 'Effacer';
        break;
      case 'DURATION':
        output = this._locale === 'en' ? 'Duration' : 'Durée';
        break;
      case 'EDIT':
        output = this._locale === 'en' ? 'Edit' : 'Éditer';
        break;
      case 'EMPTY_DATA_WARNING_MESSAGE':
        output = this._locale === 'en' ? 'No data to display.' : 'Aucune donnée à afficher.';
        break;
      case 'ENDS_WITH':
        output = this._locale === 'en' ? 'Ends With' : 'Se termine par';
        break;
      case 'EQUALS':
        output = this._locale === 'en' ? 'Equals' : 'Égale';
        break;
      case 'EQUAL_TO':
        output = this._locale === 'en' ? 'Equal to' : 'Égal à';
        break;
      case 'EXPAND_ALL_GROUPS':
        output = this._locale === 'en' ? 'Expand all Groups' : 'Étendre tous les groupes';
        break;
      case 'EXPORT_TO_CSV':
        output = this._locale === 'en' ? 'Export in CSV format' : 'Exporter en format CSV';
        break;
      case 'EXPORT_TO_EXCEL':
        output = this._locale === 'en' ? 'Export to Excel' : 'Exporter vers Excel';
        break;
      case 'EXPORT_TO_TAB_DELIMITED':
        output = this._locale === 'en' ? 'Export in Text format (Tab delimited)' : 'Exporter en format texte (délimité par tabulation)';
        break;
      case 'EXPORT_TO_TEXT_FORMAT':
        output = this._locale === 'en' ? 'Export in Text format' : 'Exporter en format texte';
        break;
      case 'FILTER_SHORTCUTS':
        output = this._locale === 'en' ? 'Filter Shortcuts' : 'Raccourcis de filtre';
        break;
      case 'FEMALE':
        output = this._locale === 'en' ? 'Female' : 'Femme';
        break;
      case 'FIRST_NAME':
        output = this._locale === 'en' ? 'First Name' : 'Prénom';
        break;
      case 'FORCE_FIT_COLUMNS':
        output = this._locale === 'en' ? 'Force fit columns' : 'Ajustement forcé des colonnes';
        break;
      case 'FREEZE_COLUMNS':
        output = this._locale === 'en' ? 'Freeze Columns' : 'Geler les colonnes';
        break;
      case 'UNFREEZE_COLUMNS':
        output = this._locale === 'en' ? 'Unfreeze Columns' : 'Dégeler les colonnes';
        break;
      case 'GREATER_THAN':
        output = this._locale === 'en' ? 'Greater than' : 'Plus grand que';
        break;
      case 'GREATER_THAN_OR_EQUAL_TO':
        output = this._locale === 'en' ? 'Greater than or equal to' : 'Plus grand ou égal à';
        break;
      case 'GROUP_BY':
        output = this._locale === 'en' ? 'Grouped By' : 'Groupé par';
        break;
      case 'GROUP_NAME':
        output = this._locale === 'en' ? 'Group Name' : 'Nom du Groupe';
        break;
      case 'HELLO':
        output = this._locale === 'en' ? 'Hello' : 'Bonjour';
        break;
      case 'HELP':
        output = this._locale === 'en' ? 'Help' : 'Aide';
        break;
      case 'HIDE_COLUMN':
        output = this._locale === 'en' ? 'Hide Column' : 'Cacher la colonne';
        break;
      case 'LAST_NAME':
        output = this._locale === 'en' ? 'Last Name' : 'Nom de famille';
        break;
      case 'LAST_UPDATE':
        output = this._locale === 'en' ? 'Last Update' : 'Dernière mise à jour';
        break;
      case 'LESS_THAN':
        output = this._locale === 'en' ? 'Less than or equal to' : 'Plus petit que';
        break;
      case 'LESS_THAN_OR_EQUAL_TO':
        output = this._locale === 'en' ? 'Less than or equal to' : 'Plus petit ou égal à';
        break;
      case 'MALE':
        output = this._locale === 'en' ? 'Male' : 'Mâle';
        break;
      case 'ITEMS':
        output = this._locale === 'en' ? 'items' : 'éléments';
        break;
      case 'ITEMS_PER_PAGE':
        output = this._locale === 'en' ? 'items per page' : 'éléments par page';
        break;
      case 'ITEMS_SELECTED':
        output = this._locale === 'en' ? 'items selected' : 'éléments sélectionnés';
        break;
      case 'LOADING':
        output = this._locale === 'en' ? 'Loading...' : 'Chargement...';
        break;
      case 'NOT_CONTAINS':
        output = this._locale === 'en' ? 'Not contains' : 'Ne contient pas';
        break;
      case 'NOT_EQUAL_TO':
        output = this._locale === 'en' ? 'Not equal to' : 'Non égal à';
        break;
      case 'NONE':
        output = this._locale === 'en' ? 'None' : 'Aucun';
        break;
      case 'OF':
        output = this._locale === 'en' ? 'of' : 'de';
        break;
      case 'OK':
        output = this._locale === 'en' ? 'OK' : 'Terminé';
        break;
      case 'OPTIONS':
        output = this._locale === 'en' ? 'Options' : 'Options';
        break;
      case 'OPTIONS_LIST':
        output = this._locale === 'en' ? 'Options List' : `Liste d'options`;
        break;
      case 'OTHER':
        output = this._locale === 'en' ? 'Other' : 'Autre';
        break;
      case 'PAGE':
        output = this._locale === 'en' ? 'Page' : 'Page';
        break;
      case 'PRODUCT':
        output = this._locale === 'en' ? 'Product' : 'Produit';
        break;
      case 'REFRESH_DATASET':
        output = this._locale === 'en' ? 'Refresh Dataset' : 'Rafraîchir les données';
        break;
      case 'REMOVE_FILTER':
        output = this._locale === 'en' ? 'Remove Filter' : 'Supprimer le filtre';
        break;
      case 'REMOVE_SORT':
        output = this._locale === 'en' ? 'Remove Sort' : 'Supprimer le tri';
        break;
      case 'RESET_INPUT_VALUE':
        output = this._locale === 'en' ? 'Reset Input Value' : 'Réinitialiser la valeur';
        break;
      case 'RESET_FORM':
        output = this._locale === 'en' ? 'Reset Form' : 'Réinitialiser le formulaire';
        break;
      case 'SORT_ASCENDING':
        output = this._locale === 'en' ? 'Sort Ascending' : 'Trier par ordre croissant';
        break;
      case 'SORT_DESCENDING':
        output = this._locale === 'en' ? 'Sort Descending' : 'Trier par ordre décroissant';
        break;
      case 'SAVE':
        output = this._locale === 'en' ? 'Save' : 'Sauvegarder';
        break;
      case 'STARTS_WITH':
        output = this._locale === 'en' ? 'Starts With' : 'Commence par';
        break;
      case 'SYNCHRONOUS_RESIZE':
        output = this._locale === 'en' ? 'Synchronous resize' : 'Redimension synchrone';
        break;
      case 'TITLE':
        output = this._locale === 'en' ? 'Title' : 'Titre';
        break;
      case 'TOGGLE_DARK_MODE':
        output = this._locale === 'en' ? 'Toggle Dark Mode' : 'Basculer le mode clair/sombre';
        break;
      case 'TOGGLE_FILTER_ROW':
        output = this._locale === 'en' ? 'Toggle Filter Row' : 'Basculer la ligne des filtres';
        break;
      case 'TOGGLE_PRE_HEADER_ROW':
        output = this._locale === 'en' ? 'Toggle Pre-Header Row' : 'Basculer la ligne de pré-en-tête';
        break;
      case 'TRUE':
        output = this._locale === 'en' ? 'True' : 'Vrai';
        break;
      case 'UPDATE':
        output = this._locale === 'en' ? 'Update' : 'Mettre a jour';
        break;
      case 'USER_PROFILE':
        output = this._locale === 'en' ? 'User Profile' : `Profile d'usager`;
        break;
      case 'COMPANY_PROFILE':
        output = this._locale === 'en' ? 'Company Profile' : `Profile de compagnie`;
        break;
      case 'SALES':
        output = this._locale === 'en' ? 'Sales' : 'Ventes';
        break;
      case 'SALES_REP':
        output = this._locale === 'en' ? 'Sales Rep.' : 'Représentant des ventes';
        break;
      case 'SELECT_ALL':
        output = this._locale === 'en' ? 'Select All' : 'Sélectionner tout';
        break;
      case 'TOGGLE_ALL_GROUPS':
        output = this._locale === 'en' ? 'Toggle all Groups' : 'Basculer tous les groupes';
        break;
      case 'FINANCE_MANAGER':
        output = this._locale === 'en' ? 'Finance Manager' : 'Responsable des finances';
        break;
      case 'HUMAN_RESOURCES':
        output = this._locale === 'en' ? 'Human Resources' : 'Ressources humaines';
        break;
      case 'IT_ADMIN':
        output = this._locale === 'en' ? 'IT Admin' : 'Administrateur IT';
        break;
      case 'DEVELOPER':
        output = this._locale === 'en' ? 'Developer' : 'Développeur';
        break;
      case 'X_OF_Y_SELECTED':
        output = this._locale === 'en' ? '# of % selected' : '# de % sélectionnés';
        break;
      case 'X_OF_Y_MASS_SELECTED':
        output = this._locale === 'en' ? '{{x}} of {{y}} records selected' : '{{x}} de {{y}} éléments sélectionnés';
        break;
    }
    return output;
  }

  use(locale: string) {
    return Promise.resolve((this._locale = locale));
  }
}
