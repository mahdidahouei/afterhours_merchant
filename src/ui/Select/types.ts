/** The shape every Select consumer maps its data into. */
export type SelectOption<TValue extends string | number = string> = {
  value: TValue;
  label: string;
  /** Optional shorter label for the trigger, e.g. "+31" instead of "(+31) Netherlands". */
  shortLabel?: string;
};
