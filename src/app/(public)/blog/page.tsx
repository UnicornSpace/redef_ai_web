import Link from "next/link";

const COPYWRITER_API_BASE =
  process.env.COPYWRITER_API_URL || "http://localhost:3000";

export default async function BlogPage() {
  const res = await fetch(`${COPYWRITER_API_BASE}/api/v1/projects/redefai`, {
    headers: { Authorization: `Bearer ${process.env.COPYWRITER_API_KEY}` },
    next: { revalidate: 60 },
  });
  const data = await res.json();
  console.log(data.data.models);
  return (
    <div className="blog-page">
      <h1>Blog Page</h1>
      <p>Welcome to the blog! Here you'll find articles and updates.</p>

      <section className="mt-10 ">
        {data.data.models.map((blog: any) => (
          <Link
            key={blog.id}
            href={`/blog/${blog.slug}`}
            className="blog-post-link"
          >
            <div key={blog.id} className="blog-post">
              <p className="text-sm text-muted-foreground">{blog.id}</p>
              <h2 className="text-xl font-bold">{blog.name}</h2>
              <p>{blog.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

/*
[
  {
    id: 'a91b3532-fd69-4363-a46f-2b3223f249f9',
    name: 'Blog',
    slug: 'blog',
    description: 'Long-form articles with rich text, metadata, and MDX export.',
    project_id: '8dd44956-de2e-4b8a-8f63-aa25f655ad9f',
    fields: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ]
  }
]
*/
