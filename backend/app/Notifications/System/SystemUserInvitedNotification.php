<?php

namespace App\Notifications\System;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemUserInvitedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $url,
        private readonly ?User $invitedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $inviterName = $this->invitedBy?->name ?? 'Azhary';

        return (new MailMessage)
            ->subject('You have been invited to Azhary')
            ->greeting('Hello, ' . $notifiable->name)
            ->line("{$inviterName} has invited you to join the Azhary operations console.")
            ->action('Set Up Your Account', $this->url)
            ->line('This invitation link will expire in 7 days.')
            ->line('If you were not expecting an invitation, you can ignore this email.');
    }
}
