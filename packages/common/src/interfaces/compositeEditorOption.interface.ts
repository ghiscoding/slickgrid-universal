export interface CompositeEditorOption {
  validationFailedMsg: string;
  show?: () => any;
  hide?: () => any;
  position?: (newPosition: any) => void;
  destroy?: () => void;
}
