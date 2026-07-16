import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function OverviewScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('overview.title')} subtitle={t('overview.empty')} />;
}
