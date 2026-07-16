import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function RecipeScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ScreenPlaceholder title={t('recipes.title')} subtitle={`#${id ?? ''}`} />;
}
