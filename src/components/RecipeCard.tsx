import type { Recipe } from '@/src/lib/graphql/types';
import { sanitizeRichText } from '@/src/lib/sanitizeHtml';
import { pluralizeUnit } from '@/src/lib/constants';
import styles from './RecipeCard.module.css';

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className={`${styles.card} print-area`}>
      {recipe.category && <p className={styles.category}>{recipe.category}</p>}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{recipe.name}</h1>
        {recipe.tags.map((tag) => (
          <span key={tag.id} className={styles.tagPill}>
            {tag.name}
          </span>
        ))}
      </div>

      {recipe.servings != null && <p className={styles.servings}>{recipe.servings} Servings</p>}

      {(recipe.totalTime != null || recipe.activeTime != null || recipe.restTime != null) && (
        <p className={styles.timeLine}>
          {recipe.totalTime != null && (
            <span>
              <strong>Total time:</strong> {recipe.totalTime} minutes
            </span>
          )}
          {recipe.activeTime != null && (
            <span>
              <strong>Active time:</strong> {recipe.activeTime} minutes
            </span>
          )}
          {recipe.restTime != null && (
            <span>
              <strong>Rest time:</strong> {recipe.restTime} minutes
            </span>
          )}
        </p>
      )}

      {recipe.cuisine && <span className={styles.cuisinePill}>{recipe.cuisine.name}</span>}

      {recipe.description && <p className={styles.description}>{recipe.description}</p>}

      <h2 className={styles.sectionHeading}>Ingredients</h2>
      {recipe.ingredients.length === 0 ? (
        <p className={styles.emptyHint}>No ingredients added yet.</p>
      ) : (
        <ul className={styles.ingredientList}>
          {recipe.ingredients.map((item) => (
            <li key={item.id}>
              {item.quantity != null && <span>{item.quantity} </span>}
              {item.unit !== 'each' && <span>{pluralizeUnit(item.unit, item.quantity)} </span>}
              <span>{item.ingredient.name}</span>
              {item.prepNote && <span className={styles.prepNote}> ({item.prepNote})</span>}
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.sectionHeading}>Instructions</h2>
      {recipe.instructions ? (
        <div className={styles.instructions} dangerouslySetInnerHTML={{ __html: sanitizeRichText(recipe.instructions) }} />
      ) : (
        <p className={styles.emptyHint}>No instructions added yet.</p>
      )}

      {recipe.notes && (
        <>
          <h2 className={styles.sectionHeading}>Notes</h2>
          <div className={styles.notes} dangerouslySetInnerHTML={{ __html: sanitizeRichText(recipe.notes) }} />
        </>
      )}

      {recipe.yieldQuantity != null && (
        <p className={styles.yieldLine}>
          Yields {recipe.yieldQuantity}
          {recipe.yieldUnit ? ` ${pluralizeUnit(recipe.yieldUnit, recipe.yieldQuantity)}` : ''}
        </p>
      )}
    </article>
  );
}
