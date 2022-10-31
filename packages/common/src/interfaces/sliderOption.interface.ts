export interface SliderOption {
  /** Defaults to true, hide the slider number shown on the right side */
  hideSliderNumber?: boolean;

  /** Slider max end value */
  sliderEndValue?: number;

  /** Slider min start value */
  sliderStartValue?: number;
}

export interface SliderRangeOption extends Omit<SliderOption, 'hideSliderNumber'> {
  /** Defaults to false, do we want to show slider track coloring? */
  enableSliderTrackColoring?: boolean;

  /** Defaults to false, hide the slider numbers shown on the left/right side */
  hideSliderNumbers?: boolean;

  /** Defaults to 0, minimum value gap before reaching the maximum end value */
  stopGapBetweenSliderHandles?: number;

  /** Defaults to "#3C97DD", what will be the color to use to represent slider range */
  sliderTrackFilledColor?: string;
}