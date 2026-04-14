interface GiscusCommentsProps {
  agentId: string;
}

/**
 * Embeds GitHub Discussions as comments via giscus.
 * The giscus script is loaded dynamically in AgentDetail.tsx
 * when the Discussion tab is selected.
 */
export default function GiscusComments({ agentId }: GiscusCommentsProps) {
  const repo = import.meta.env.VITE_GISCUS_REPO || '';
  const repoId = import.meta.env.VITE_GISCUS_REPO_ID || '';
  const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || '';

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="giscus-placeholder">
        <p>Discussions are not configured yet.</p>
        <p className="giscus-hint">
          Set up <a href="https://giscus.app" target="_blank" rel="noopener noreferrer">giscus</a> and
          add VITE_GISCUS_REPO, VITE_GISCUS_REPO_ID, and VITE_GISCUS_CATEGORY_ID to your environment.
        </p>
      </div>
    );
  }

  // Giscus is loaded dynamically — this is just a container
  return <div className="giscus" key={agentId} />;
}
