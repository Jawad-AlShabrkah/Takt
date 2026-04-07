CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`widthX` decimal(10,2) NOT NULL,
	`heightY` decimal(10,2) NOT NULL,
	`colorCode` varchar(7) NOT NULL DEFAULT '#3B82F6',
	`maxCapacity` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`fromAreaId` int,
	`toAreaId` int,
	`fromPositionX` decimal(10,2),
	`fromPositionY` decimal(10,2),
	`toPositionX` decimal(10,2),
	`toPositionY` decimal(10,2),
	`movementType` enum('within_area','between_areas','created','status_change') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mainCategory` enum('Bay','SPU') NOT NULL,
	`subCategory` enum('ELK-04','ELK-04C','ELK-3','ELK-14') NOT NULL,
	`widthX` decimal(10,2) NOT NULL,
	`heightY` decimal(10,2) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sdNumber` varchar(100) NOT NULL,
	`salesNumber` varchar(100),
	`name` varchar(255) NOT NULL,
	`categoryId` int NOT NULL,
	`currentAreaId` int,
	`positionX` decimal(10,2),
	`positionY` decimal(10,2),
	`status` enum('blue','yellow','green') NOT NULL DEFAULT 'blue',
	`comments` text,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sdNumber_unique` UNIQUE(`sdNumber`)
);
--> statement-breakpoint
CREATE TABLE `visibility_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('user','admin','external') NOT NULL,
	`visibleFields` text NOT NULL,
	`canEdit` boolean NOT NULL DEFAULT false,
	`canDelete` boolean NOT NULL DEFAULT false,
	`canViewHistory` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visibility_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','external') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `areas_name_idx` ON `areas` (`name`);--> statement-breakpoint
CREATE INDEX `areas_active_idx` ON `areas` (`isActive`);--> statement-breakpoint
CREATE INDEX `movements_product_idx` ON `movements` (`productId`);--> statement-breakpoint
CREATE INDEX `movements_user_idx` ON `movements` (`userId`);--> statement-breakpoint
CREATE INDEX `movements_created_idx` ON `movements` (`createdAt`);--> statement-breakpoint
CREATE INDEX `categories_main_idx` ON `product_categories` (`mainCategory`);--> statement-breakpoint
CREATE INDEX `categories_sub_idx` ON `product_categories` (`subCategory`);--> statement-breakpoint
CREATE INDEX `products_sd_idx` ON `products` (`sdNumber`);--> statement-breakpoint
CREATE INDEX `products_area_idx` ON `products` (`currentAreaId`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`categoryId`);