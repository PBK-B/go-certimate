import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientResponseError } from "pocketbase";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PbErrorData } from "@/domain/base";
import { Access, accessFormType, getUsageByConfigType } from "@/domain/access";
import { save } from "@/repository/access";
import { useConfig } from "@/providers/config";

type AccessLocalFormProps = {
  op: "add" | "edit" | "copy";
  data?: Access;
  onAfterReq: () => void;
};

const AccessLocalForm = ({ data, op, onAfterReq }: AccessLocalFormProps) => {
  const { addAccess, updateAccess, reloadAccessGroups } = useConfig();
  const { t } = useTranslation();

  const formSchema = z.object({
    id: z.string().optional(),
    name: z
      .string()
      .min(1, "access.authorization.form.name.placeholder")
      .max(64, t("common.errmsg.string_max", { max: 64 })),
    configType: accessFormType,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      configType: "local",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const req: Access = {
      id: data.id as string,
      name: data.name,
      configType: data.configType,
      usage: getUsageByConfigType(data.configType),

      config: {},
    };

    try {
      req.id = op == "copy" ? "" : req.id;
      const rs = await save(req);

      onAfterReq();

      req.id = rs.id;
      req.created = rs.created;
      req.updated = rs.updated;
      if (data.id && op == "edit") {
        updateAccess(req);
      } else {
        addAccess(req);
      }

      reloadAccessGroups();
    } catch (e) {
      const err = e as ClientResponseError;

      Object.entries(err.response.data as PbErrorData).forEach(([key, value]) => {
        form.setError(key as keyof z.infer<typeof formSchema>, {
          type: "manual",
          message: value.message,
        });
      });

      return;
    }
  };

  return (
    <>
      <div className="max-w-[35em] mx-auto mt-10">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("access.authorization.form.name.label")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("access.authorization.form.name.placeholder")} {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>{t("access.authorization.form.config.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="configType"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>{t("access.authorization.form.config.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormMessage />

            <div className="flex justify-end">
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default AccessLocalForm;
