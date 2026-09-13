import { useState } from 'react'
import { useWs } from '../lib/ctx'
import PostComposer from '../components/PostComposer'
import Replies from '../components/Replies'
import { Avatar, Badge, Button, Card, Empty, PageHeader, relDate } from '../components/ui'
import { I } from '../components/icons'

const PLATFORM: Record<string, string> = {
  linkedin: 'LinkedIn', x: 'X', other: 'Other',
}

export default function Content() {
  const ws = useWs()
  const [composing, setComposing] = useState(false)
  const byId = new Map(ws.members.map((m) => [m.id, m]))

  const counts = ws.posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.platform] = (acc[p.platform] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <PageHeader
        title="Content"
        sub="What has been published about the company. Each post keeps the pitch as it read at the time."
        action={
          !composing && (
            <Button onClick={() => setComposing(true)}>Add post</Button>
          )
        }
      />

      {ws.posts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {Object.entries(counts).map(([k, n]) => (
            <Badge key={k}>
              {PLATFORM[k] ?? k} · {n}
            </Badge>
          ))}
        </div>
      )}

      {composing && (
        <PostComposer
          workspaceId={ws.workspace!.id}
          me={ws.me}
          onDone={() => { setComposing(false); ws.refresh() }}
          onCancel={() => setComposing(false)}
        />
      )}

      {ws.posts.length === 0 ? (
        <Card>
          <Empty
            icon={<I.content />}
            title="Nothing published yet"
            sub="Log a post to keep a record of what has been said publicly."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {ws.posts.map((p) => {
            const m = byId.get(p.member_id)
            return (
              <article key={p.id} className="px-4 py-3.5 transition-colors hover:bg-hover/40">
                <div className="flex gap-2.5">
                  <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="text-ink">{m?.name ?? 'Unnamed'}</span>
                      <span>{relDate(p.created_at)}</span>
                      <span className="ml-auto">
                        <Badge>{PLATFORM[p.platform] ?? p.platform}</Badge>
                      </span>
                    </div>

                    <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                      {p.caption}
                    </p>

                    {p.pitch_snapshot && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted hover:text-ink">
                          Pitch at time of posting
                        </summary>
                        <p className="mt-1.5 border-l-2 border-line pl-3 text-xs
                          whitespace-pre-wrap text-muted">
                          {p.pitch_snapshot}
                        </p>
                      </details>
                    )}

                    <Replies
                      workspaceId={ws.workspace!.id}
                      target={{ post_id: p.id }}
                      replies={ws.replies.filter((r) => r.post_id === p.id)}
                      members={byId}
                      me={ws.me}
                      onDone={ws.refresh}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </Card>
      )}
    </>
  )
}
