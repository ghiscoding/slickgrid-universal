#### Index
- [Using `collection` or `collectionAsync`](#using-collection-or-collectionasync)
- [Filter Options (`AutocompleterOption` interface)](#filter-options-autocompleteroption-interface)
- [Using Remote API](#using-external-remote-api)
- [Force User Input](#autocomplete---force-user-input)
- [Update Filters Dynamically](../../column-functionalities/filters/input-filter.md#update-filters-dynamically)
- [Animated Gif Demo](#animated-gif-demo)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/Example3) | [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example3.tsx)

### Introduction
AutoComplete is a functionality that let the user start typing characters and the autocomplete will try to give suggestions according to the characters entered. The collection can be a JSON files (collection of strings or objects) or can also be an external resource like a JSONP query to an external API. For a demo of what that could look like, take a look at the [animated gif demo](#animated-gif-demo) below.

We use an external lib named [Autocomplete](https://github.com/kraaden/autocomplete) (aka `autocompleter` on npm) by Kraaden.

## Using `collection` or `collectionAsync`
If you want to pass the entire list to the AutoComplete (like a JSON file or a Web API call), you can do so using the `collection` or the `collectionAsync` (the latter will load it asynchronously). You can also see that the Editor and Filter have almost the exact same configuration (apart from the `model` that is obviously different).

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const graphqlService = new GraphqlService();

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setColumns([
      {
        id: 'countryOfOrigin', name: 'Country of Origin', field: 'countryOfOrigin',
        formatter: Formatters.complexObject,
        dataKey: 'code', // our list of objects has the structure { code: 'CA', name: 'Canada' }, since we want to use the code`, we will set the dataKey to "code"
        labelKey: 'name', // while the displayed value is "name"
        type: 'object',
        sorter: Sorters.objectString, // since we have set dataKey to "code" our output type will be a string, and so we can use this objectString, this sorter always requires the dataKey
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autoComplete,
          customStructure: { label: 'name', value: 'code' },
          collectionAsync: fetch('assets/data/countries.json'), // this demo will load the JSON file asynchronously
        },
        filter: {
          model: Filters.autoComplete,
          customStructure: { label: 'name', value: 'code' },
          collectionAsync: fetch('assets/data/countries.json'),
        }
      }
    ]);

    setOptions({/*...*/});
  }
}
```

### Filter Options (`AutocompleterOption` interface)
All the available options that can be provided as filter `options` to your column definitions can be found under this [AutocompleterOption interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/autocompleterOption.interface.ts) and you should cast your filter `options` to that interface to make sure that you use only valid options of the autocomplete library.

```ts
filter: {
  model: Filters.autocompleter,
  // previously known as `filterOptions` for < 9.0
  options: {
    minLength: 3,
  } as AutocompleterOption
}
```

## Using External Remote API
You could also use external 3rd party Web API (can be JSONP query or regular JSON). This will make a much shorter result since it will only return a small subset of what will be displayed in the AutoComplete Editor or Filter. For example, we could use GeoBytes which provide a JSONP Query API for the cities of the world, you can imagine the entire list of cities would be way too big to download locally, so this is why we use such API.

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setColumns([
      {
        id: 'cityOfOrigin', name: 'City of Origin', field: 'cityOfOrigin',
        filterable: true,
        minWidth: 100,
        editor: {
          model: Editors.autoComplete,
          placeholder: 'search city', //  you can provide an optional placeholder to help your users

          // use your own autocomplete options, instead of $.ajax, use http
          // here we use $.ajax just because I'm not sure how to configure http with JSONP and CORS
          // previously known as `filterOptions` for < 9.0
          options: {
            minLength: 3, // minimum count of character that the user needs to type before it queries to the remote
            source: (request, response) => {
              $.ajax({
                url: 'http://gd.geobytes.com/AutoCompleteCity',
                dataType: 'jsonp',
                data: {
                  q: request.term // geobytes requires a query with "q" queryParam representing the chars typed (e.g.:  gd.geobytes.com/AutoCompleteCity?q=van
                },
                success: (data) => response(data)
              });
            }
          },
        },
        filter: {
          model: Filters.autoComplete,
          // placeholder: '&#128269; search city', // &#128269; is a search icon, this provide an option placeholder

          // use your own autocomplete options, instead of $.ajax, use http
          // here we use $.ajax just because I'm not sure how to configure http with JSONP and CORS
          options: {
            minLength: 3, // minimum count of character that the user needs to type before it queries to the remote
            source: (request, response) => {
              $.ajax({
                url: 'http://gd.geobytes.com/AutoCompleteCity',
                dataType: 'jsonp',
                data: {
                  q: request.term
                },
                success: (data) => {
                  response(data);
                }
              });
            }
          },
        }
      }
    ]);

    setOptions({/*...*/});
  }
}
```

## Autocomplete - force user input
If you want to add the autocomplete functionality but want the user to be able to input a new option, then follow the example below:

```ts
const columnDefinitions = [
  {
    id: 'area',
    name: 'Area',
    field: 'area',
    editor: {
      model: Editors.autocompleter,
      // previously known as `filterOptions` for < 9.0
      options: {
        minLength: 0,
        forceUserInput: true,
        fetch: (searchText, updateCallback) => {
          updateCallback(areas); // add here the array
        },
      }
    }
  },
];
```
You can also use the `minLength` to limit the autocomplete text to `0` characters or more, the default number is `3`.

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50624023-d5e16c80-0ee9-11e9-809c-f98967953ba4.gif)
