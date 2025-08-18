"use client";

import { useState } from "react";
import { createPostAction } from "./actions";
import { Button, Input, Card, CardBody, Chip, Image, Spinner } from "@heroui/react";
import { Icon } from "@/components/ui/Icon";
import { useRouter, usePathname } from "next/navigation";

export default function CreateForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    
    // Add tags to FormData
    fd.set("tags", tags.join(", "));

    try {
      const res = await createPostAction(fd);
      console.log("createPostAction result:", res);

      if (!res.ok) {
        setMessage(res.error || "Failed to create post");
      } else {
        // Check if there's a warning
        if ('warning' in res && res.warning) {
          setMessage(res.warning);
        } else {
          setMessage("Post created successfully!");
        }
        form.reset();
        setImagePreviews([]);
        setTags([]);
        
        // Redirect to user's profile page after a short delay
        setTimeout(() => {
          router.push(`/${currentLocale}/me`);
          router.refresh(); // Force refresh to show new content
        }, 500);
      }
    } finally {
      setPending(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: string[] = [];
      const fileArray = Array.from(files).slice(0, 1); // Max 1 image
      
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === fileArray.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="shadow-none border-none bg-transparent">
        <CardBody className="space-y-6 p-0">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image (required)
            </label>
            
            {imagePreviews.length > 0 ? (
              <div className="mb-3">
                <div className="relative aspect-square max-w-sm mx-auto">
                  <Image
                    src={imagePreviews[0]}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                    classNames={{
                      wrapper: "w-full h-full"
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                <Icon name="add_photo_alternate" size="xl" className="text-default-400 mb-2" />
                <p className="text-sm text-default-500">
                  Select an image to upload
                </p>
              </div>
            )}
            
            <input
              name="images"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
              required
            />
            <Button
              as="label"
              htmlFor="image-upload"
              color="default"
              variant="flat"
              className="w-full"
              startContent={<Icon name="photo_library" />}
            >
              {imagePreviews.length > 0 ? "Change Image" : "Select Image"}
            </Button>
          </div>

          {/* Title Input */}
          <Input
            name="title"
            label="Title (optional)"
            placeholder="Enter a title for your post"
            maxLength={64}
            variant="bordered"
            classNames={{
              label: "text-sm font-medium",
              input: "text-base",
            }}
          />

          {/* Body Textarea */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Body (optional)
            </label>
            <textarea
              name="body"
              placeholder="Write your post content..."
              maxLength={32}
              rows={3}
              className="w-full px-3 py-2 text-base border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none resize-none transition-colors dark:bg-default-100/50"
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (optional, max 10)
            </label>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() => handleRemoveTag(tag)}
                    variant="flat"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag..."
                variant="bordered"
                size="sm"
                disabled={tags.length >= 10}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                color="default"
                variant="flat"
                size="md"
                isIconOnly
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                <Icon name="add" />
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            color="primary"
            className="w-full"
            size="lg"
            disabled={pending}
            startContent={pending ? <Spinner size="sm" color="current" /> : <Icon name="publish" />}
          >
            {pending ? "Creating..." : "Create Post"}
          </Button>

          {/* Message Display */}
          {message && (
            <Card className={`${message.includes("successfully") ? "bg-success-50 dark:bg-success-900/20" : "bg-danger-50 dark:bg-danger-900/20"}`}>
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <Icon 
                    name={message.includes("successfully") ? "check_circle" : "error"} 
                    className={message.includes("successfully") ? "text-success" : "text-danger"}
                  />
                  <p className={`text-sm ${message.includes("successfully") ? "text-success-700 dark:text-success" : "text-danger-700 dark:text-danger"}`}>
                    {message}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </form>
  );
}
