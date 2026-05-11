CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(512) NOT NULL,
	`filepath` varchar(1024) NOT NULL,
	`fileSize` int NOT NULL DEFAULT 0,
	`mimeType` varchar(128) NOT NULL DEFAULT 'application/octet-stream',
	`isSecured` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
