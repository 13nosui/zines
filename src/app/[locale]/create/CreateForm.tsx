"use client";

import { useState } from "react";
import { createPostAction } from "./actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { useTranslations } from "next-intl";

export default function CreateForm() {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bodyText, setBodyText] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setIsSuccess(false);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Add tags as comma-separated string
    fd.set("tags", tags.join(", "));

    // Remove the file input from form data (we're managing it separately)
    fd.delete("images");
    
    // Add selected files
    selectedFiles.forEach((file) => {
      fd.append("images", file);
    });

    try {
      const res = await createPostAction(fd);
      // 追加: 返却オブジェクトをConsoleに出す
      console.log("createPostAction result:", res);

      if (!res.ok) {
        // 追加: エラーメッセージ全文を表示（payload まで含まれる）
        setMessage(res.error || "Failed to create post");
        setIsSuccess(false);
      } else {
        setMessage("Post created successfully!");
        setIsSuccess(true);
        form.reset();
        setTags([]);
        setSelectedFiles([]);
        setBodyText("");
        // Clean up preview URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImagePreviews([]);
      }
    } finally {
      setPending(false);
    }
  }

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
        setTags([...tags, trimmedTag]);
        setTagInput("");
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const selectedImages = files.slice(0, 3); // Maximum 3 files
      setSelectedFiles(selectedImages);
      
      // Create preview URLs
      const previews = selectedImages.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="bg-content1">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Create New Post</p>
            <p className="text-small text-default-500">Share your content with images</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            name="title"
            label="Title"
            placeholder="Enter post title"
            variant="bordered"
            maxLength={64}
            isRequired
            startContent={
              <span className="material-symbols-rounded text-default-400">
                title
              </span>
            }
            classNames={{
              inputWrapper: "h-14"
            }}
          />

          <Textarea
            name="body"
            label="Description"
            placeholder="Write a short description"
            variant="bordered"
            maxLength={32}
            minRows={2}
            maxRows={4}
            value={bodyText}
            onValueChange={setBodyText}
            description={`${bodyText.length}/32 characters`}
            startContent={
              <span className="material-symbols-rounded text-default-400 text-small self-start mt-1">
                description
              </span>
            }
            classNames={{
              input: "min-h-[60px]"
            }}
          />

          <div className="space-y-2">
            <Input
              label="Tags"
              placeholder="Press Enter or comma to add tags"
              variant="bordered"
              value={tagInput}
              onValueChange={setTagInput}
              onKeyDown={handleTagAdd}
              description={`${tags.length}/10 tags added`}
              startContent={
                <span className="material-symbols-rounded text-default-400">
                  label
                </span>
              }
              classNames={{
                inputWrapper: "h-14"
              }}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() => handleTagRemove(tag)}
                    variant="flat"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Images (1-3 required)</label>
            <div className="flex items-center gap-4">
              <Button
                as="label"
                variant="flat"
                startContent={
                  <span className="material-symbols-rounded">
                    add_photo_alternate
                  </span>
                }
                className="cursor-pointer"
              >
                Choose Images
                <input
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Button>
              {selectedFiles.length > 0 && (
                <p className="text-sm text-default-500">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="solid"
                      color="danger"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity material-symbols-rounded"
                      onPress={() => removeImage(index)}
                    >
                      close
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          color="primary"
          isLoading={pending}
          isDisabled={pending || selectedFiles.length === 0}
          startContent={
            !pending && (
              <span className="material-symbols-rounded">
                publish
              </span>
            )
          }
        >
          {pending ? "Creating..." : "Create Post"}
        </Button>
      </div>

      {message && (
        <Alert
          color={isSuccess ? "success" : "danger"}
          description={message}
          startContent={
            <span className="material-symbols-rounded">
              {isSuccess ? "check_circle" : "error"}
            </span>
          }
          className="whitespace-pre-wrap"
        />
      )}
    </form>
  );
}
