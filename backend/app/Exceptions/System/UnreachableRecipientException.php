<?php

namespace App\Exceptions\System;

use RuntimeException;

/** No usable WhatsApp number exists for the student (nor for their guardian). */
class UnreachableRecipientException extends RuntimeException {}
