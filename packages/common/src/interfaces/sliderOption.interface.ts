export interface SliderOption {
  /**
   * Defaults to false, do we want to show slider track coloring?
   * You can change the slider track filled color via the option "sliderTrackFilledColor" or the CSS variable "--slick-slider-filter-filled-track-color"
   */
  enableSliderTrackColoring?: boolean;

  /** Defaults to true, hide the slider number shown on the right side */
  hideSliderNumber?: boolean;

  /** Slider min start value */
  sliderStartValue?: number;

  /** Defaults to "#3C97DD", what will be the color to use to represent slider range */
  sliderTrackFilledColor?: string;
}

export interface SliderRangeOption extends Omit<SliderOption, 'hideSliderNumber'> {
  /** Defaults to false, hide the slider numbers shown on the left/right side */
  hideSliderNumbers?: boolean;

  /** Slider max end value */
  sliderEndValue?: number;

  /** Defaults to 0, minimum value gap before reaching the maximum end value */
  stopGapBetweenSliderHandles?: number;
}

export interface CurrentSliderOption {
  minValue: number;
  maxValue: number;
  step: number;
  sliderTrackBackground?: string;
}

export type SliderType = 'single' | 'double' | 'compound';