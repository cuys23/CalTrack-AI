<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadService
{
    /**
     * Upload an image file (or base64 encoded string) and return accessible public URL.
     */
    public function uploadMealImage(UploadedFile|string $file): string
    {
        $disk = 'public';
        $filename = 'meals/'.Str::uuid().'.jpg';

        if ($file instanceof UploadedFile) {
            $path = $file->storeAs('meals', Str::uuid().'.'.$file->getClientOriginalExtension(), $disk);

            return Storage::disk($disk)->url($path);
        }

        // If Base64 string
        if (is_string($file)) {
            $cleanBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $file);
            $imageData = base64_decode($cleanBase64);
            Storage::disk($disk)->put($filename, $imageData);

            return Storage::disk($disk)->url($filename);
        }

        throw new \InvalidArgumentException('Unsupported file format for upload.');
    }
}
