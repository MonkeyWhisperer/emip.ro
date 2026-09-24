import { useEffect, useState } from "react";
import { blog } from "../../content/home";
import { fetchCategories, fetchPosts, type Category, type PostSummary } from "../../lib/blog";
import { PostCard, firstCategoryLabel } from "../../components/blog/PostCard";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Section, SectionHeader } from "../../components/ui/Section";

/** Latest three posts. Loaded after render so the landing page never waits on the API. */
export function BlogPreview() {
  const [data, setData] = useState<{ posts: PostSummary[]; categories: Category[] } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPosts(), fetchCategories()])
      .then(([posts, categories]) => active && setData({ posts: posts.slice(0, 3), categories }))
      .catch(() => active && setData({ posts: [], categories: [] }));
    return () => {
      active = false;
    };
  }, []);

  // Nothing to show (API down or no posts): hide the section rather than render an empty grid.
  if (data && data.posts.length === 0) return null;
  const labels = new Map(data?.categories.map((c) => [c.slug, c.label]));

  return (
    <Section id="blog" tone="muted">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader eyebrow={blog.eyebrow} title={blog.title} text={blog.text} align="left" />
        <ButtonLink href={blog.all.href} variant="outline" arrow className="shrink-0 self-start lg:self-auto">
          {blog.all.label}
        </ButtonLink>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3" aria-busy={!data}>
        {data
          ? data.posts.map((post) => (
              <PostCard key={post.id} post={post} categoryLabel={firstCategoryLabel(post, labels)} />
            ))
          : Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
      </div>
    </Section>
  );
}
