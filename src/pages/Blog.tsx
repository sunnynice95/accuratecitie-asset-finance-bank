import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  created_at: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card shadow-custom-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logo} alt="Accuratecitiefinance" className="w-8 h-8 object-contain" />
              <h1 className="text-lg font-bold text-foreground">Blog</h1>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedPost.cover_image_url && (
            <img
              src={selectedPost.cover_image_url}
              alt={selectedPost.title}
              className="w-full h-64 sm:h-80 object-cover rounded-xl mb-8"
            />
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {selectedPost.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm mb-8">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {selectedPost.author_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(selectedPost.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {selectedPost.content}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card shadow-custom-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="Accuratecitiefinance" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Latest News & Updates</h2>
          <p className="text-muted-foreground">Stay informed with the latest from Accuratecitiefinance</p>
        </div>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden cursor-pointer hover:shadow-custom-lg transition-smooth border-border/50"
                onClick={() => setSelectedPost(post)}
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
