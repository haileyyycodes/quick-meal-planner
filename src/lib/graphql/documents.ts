import { gql } from '@apollo/client';

const RECIPE_LIST_FIELDS = gql`
  fragment RecipeListFields on Recipe {
    id
    name
    category
    totalTime
    draft
    cuisine {
      id
      name
    }
    tags {
      id
      name
    }
  }
`;

export const RECIPES_QUERY = gql`
  ${RECIPE_LIST_FIELDS}
  query Recipes($filter: RecipeFilterInput) {
    recipes(filter: $filter) {
      ...RecipeListFields
    }
  }
`;

export const RECIPE_QUERY = gql`
  query Recipe($id: Int!) {
    recipe(id: $id) {
      id
      name
      description
      category
      servings
      yieldQuantity
      yieldUnit
      totalTime
      activeTime
      restTime
      originalRecipeLink
      instructions
      notes
      draft
      cuisine {
        id
        name
      }
      tags {
        id
        name
      }
      ingredients {
        id
        quantity
        unit
        sizeQuantity
        sizeUnit
        prepNote
        ingredient {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_RECIPE_MUTATION = gql`
  mutation CreateRecipe($input: RecipeInput!) {
    createRecipe(input: $input) {
      id
    }
  }
`;

export const UPDATE_RECIPE_MUTATION = gql`
  mutation UpdateRecipe($id: Int!, $input: RecipeInput!) {
    updateRecipe(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_RECIPE_MUTATION = gql`
  mutation DeleteRecipe($id: Int!) {
    deleteRecipe(id: $id)
  }
`;

export const INGREDIENTS_QUERY = gql`
  query IngredientOptions($search: String) {
    ingredients(search: $search) {
      id
      name
    }
  }
`;

export const CUISINES_QUERY = gql`
  query CuisineOptions($search: String) {
    cuisines(search: $search) {
      id
      name
    }
  }
`;

export const TAGS_QUERY = gql`
  query TagOptions($search: String) {
    tags(search: $search) {
      id
      name
    }
  }
`;
