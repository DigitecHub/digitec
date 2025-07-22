"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { FaArrowLeft, FaUser, FaCalendarAlt, FaTag, FaClock, FaChevronUp } from "react-icons/fa";
import styles from "../../../styles/BlogPost.module.css";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error || !data) {
        setError("Blog post not found.");
        setLoading(false);
        return;
      }
      setPost(data);
      setLoading(false);
    }
    if (slug) fetchPost();
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading blog post...</p>
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>Something went wrong</h2>
        <p className={styles.errorText}>{error || "Blog post not found."}</p>
        <Link href="/blog" className={styles.backToBlog}>
          Return to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.blogPostContainer}>
      <div className={styles.blogHeader}>
        <Link href="/blog" className={styles.backLink}>
          <FaArrowLeft /> Back to Blog
        </Link>
      </div>
      {post.featured_image_url && (
        <div className={styles.featuredImageWrapper}>
          <img src={post.featured_image_url} alt={post.title} className={styles.featuredImage} />
        </div>
      )}
      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.excerpt}>{post.excerpt}</p>
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <FaUser className={styles.metaIcon} />
          <span>{post.author_id ? post.author_id : "Unknown Author"}</span>
        </div>
        <div className={styles.metaItem}>
          <FaCalendarAlt className={styles.metaIcon} />
          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}</span>
        </div>
        {post.read_time_minutes && (
          <div className={styles.metaItem}>
            <FaClock className={styles.metaIcon} />
            <span>{post.read_time_minutes} min read</span>
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className={styles.metaItem}>
            <FaTag className={styles.metaIcon} />
            <span className={styles.tags}>
              {post.tags.map((tag, i) => (
                <span key={tag} className={styles.tag}>{tag}{i < post.tags.length - 1 ? ", " : ""}</span>
              ))}
            </span>
          </div>
        )}
      </div>
      <article className={styles.content}>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      {showScrollTop && (
        <button className={styles.scrollToTop} onClick={scrollToTop} aria-label="Scroll to top">
          <FaChevronUp />
        </button>
      )}
    </div>
  );
}
