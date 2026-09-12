'use client';

import { useId } from 'react';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { Button } from '@/src/components/ui/Button';
import { emptyStepRow, StepRowState } from './types';
import styles from './RecipeForm.module.css';

type StepsEditorProps = {
  value: StepRowState[];
  onChange: (steps: StepRowState[]) => void;
};

export function StepsEditor({ value, onChange }: StepsEditorProps) {
  const updateStep = (index: number, text: string) => {
    onChange(value.map((step, stepIndex) => (stepIndex === index ? { ...step, text } : step)));
  };

  const removeStep = (index: number) => {
    onChange(value.filter((_, stepIndex) => stepIndex !== index));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    const reordered = [...value];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onChange(reordered);
  };

  const addStep = () => {
    onChange([...value, emptyStepRow()]);
  };

  return (
    <div className={styles.rowGroup}>
      {value.length === 0 && <p className={styles.emptyHint}>No steps yet.</p>}
      <ol className={styles.stepList}>
        {value.map((step, index) => (
          <StepRowFields
            key={step.key}
            step={step}
            index={index}
            isFirst={index === 0}
            isLast={index === value.length - 1}
            onChange={(text) => updateStep(index, text)}
            onMoveUp={() => moveStep(index, -1)}
            onMoveDown={() => moveStep(index, 1)}
            onRemove={() => removeStep(index)}
          />
        ))}
      </ol>
      <Button type="button" variant="secondary" onClick={addStep}>
        + Add step
      </Button>
    </div>
  );
}

function StepRowFields({
  step,
  index,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  step: StepRowState;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (text: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const uid = useId();

  return (
    <li className={styles.stepRow}>
      <div className={styles.stepRowHeader}>
        <span className={styles.stepNumber} aria-hidden="true">
          {index + 1}
        </span>
        <div className={styles.stepRowActions}>
          <Button type="button" variant="ghost" onClick={onMoveUp} disabled={isFirst} aria-label={`Move step ${index + 1} up`}>
            ↑
          </Button>
          <Button type="button" variant="ghost" onClick={onMoveDown} disabled={isLast} aria-label={`Move step ${index + 1} down`}>
            ↓
          </Button>
          <Button type="button" variant="ghost" onClick={onRemove} aria-label={`Remove step ${index + 1}`}>
            Remove
          </Button>
        </div>
      </div>
      <RichTextEditor
        id={uid}
        value={step.text}
        onChange={onChange}
        placeholder={`Describe step ${index + 1}…`}
        ariaLabel={`Step ${index + 1} text`}
      />
    </li>
  );
}
