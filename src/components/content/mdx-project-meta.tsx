interface ProjectMetaProps {
  role: string;
  stack: string;
  year: string | number;
  outcome: string;
}

/** Optional in-body meta grid for MDX case studies. */
export function ProjectMeta({ role, stack, year, outcome }: ProjectMetaProps) {
  return (
    <dl className="not-prose my-8 grid gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <dt className="meta-label">Role</dt>
        <dd className="text-sm text-foreground">{role}</dd>
      </div>
      <div className="space-y-1">
        <dt className="meta-label">Stack</dt>
        <dd className="text-sm text-foreground">{stack}</dd>
      </div>
      <div className="space-y-1">
        <dt className="meta-label">Year</dt>
        <dd className="text-sm text-foreground">{year}</dd>
      </div>
      <div className="space-y-1">
        <dt className="meta-label">Outcome</dt>
        <dd className="text-sm text-foreground">{outcome}</dd>
      </div>
    </dl>
  );
}
