import { useMemo } from 'react'
import TaskTable from '../components/TaskTable'
import { buildItemOptions } from '../lib/itemOptions'
import { useLang } from '../i18n'

export default function ToDo({ project, entries, profiles, currentUserId }) {
  const { t } = useLang()
  const itemOptions = useMemo(
    () => buildItemOptions(entries, { section: t('common.section'), unnamed: t('common.unnamedItem') }),
    [entries, t],
  )
  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('tasks.pageTitle')}</h1>
        <p className="subtitle">{t('tasks.pageSub')}</p>
      </header>
      <div className="panel">
        <TaskTable
          projectId={project.id}
          profiles={profiles}
          currentUserId={currentUserId}
          itemOptions={itemOptions}
        />
      </div>
    </div>
  )
}
