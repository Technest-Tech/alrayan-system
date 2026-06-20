<?php

namespace App\Notifications\System;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemPasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $url) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset your Azhary account password')
            ->greeting('Hello, ' . $notifiable->name)
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $this->url)
            ->line('This link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
