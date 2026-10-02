import { Project } from '@/state/api'
import React from 'react'
import Highlight from '@/components/Highlight'

type Props = {
    project : Project;
    highlights?: Record<string, string[]>;
}

const ProjectCard = ({project, highlights}: Props) => {
  return (
    <div className='rounded border p-4 shadow'>
        <h3><Highlight text={highlights?.name?.[0]} fallback={project.name}/></h3>
        <p>Description: <Highlight text={highlights?.description?.[0]} fallback={project.description}/></p>
        <p>Start Date: {project.startDate}</p>
        <p>End Date: {project.endDate}</p>
    </div>
  )
}

export default ProjectCard