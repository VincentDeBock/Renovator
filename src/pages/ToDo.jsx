import { useMemo } from 'react'
import TaskTable from '../components/TaskTable'
import { buildItemOptions } from '../lib/itemOptions'

export default function ToDo({ project, entries, profiles, currentUserId }) {
  const itemOptions = useMemo(() => buildItemOptions(entries), [entries])
  return (
    <div className="page">
      <header className="page-header">
        <h1>Taken</h1>
        <p className="subtitle">Beheer en volg jullie taken</p>
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
